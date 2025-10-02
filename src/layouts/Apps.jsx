import Nav from '../layouts/Nav';
import { useState, useMemo, useRef, useEffect, useCallback, memo } from 'react';
import { Search, ChevronDown, LayoutGrid } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOptions } from '/src/utils/optionsContext';
import appsData from '../data/apps.json';
import styles from '../styles/apps.module.css';
import theme from '../styles/theming.module.css';
import Pagination from '@mui/material/Pagination';
import clsx from 'clsx';

const SORT_OPTIONS = [
  { value: 'categorical', label: 'Categorical' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'newest', label: 'Newest' },
];

const Apps = memo(({ type = 'default', data = appsData }) => {
  const nav = useNavigate();
  const { options } = useOptions();
  const appsList = useMemo(() => data[type] || [], [data, type]);

  const [q, setQ] = useState('');
  const [sort, setSort] = useState('categorical');
  const [page, setPage] = useState(1);
  const [showSort, setShowSort] = useState(false);
  const sortRef = useRef(null);
  const [fallback, setFallback] = useState({});

  const perPage = options.itemsPerPage || 20;

  useEffect(() => {
    const close = (e) => !sortRef.current?.contains(e.target) && setShowSort(false);
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, []);

  const sortedApps = useMemo(() => {
    const indexed = appsList.map((a, i) => ({ ...a, __i: i }));
    switch (sort) {
      case 'alphabetical':
        return [...indexed].sort((a, b) => a.appName.localeCompare(b.appName, undefined, { sensitivity: 'base' }));
      case 'categorical':
        return [...indexed].sort((a, b) =>
          (a.desc || '').localeCompare(b.desc || '', undefined, { sensitivity: 'base' }) ||
          a.appName.localeCompare(b.appName, undefined, { sensitivity: 'base' })
        );
      case 'newest':
        return [...indexed].sort((a, b) => b.__i - a.__i);
      default:
        return indexed;
    }
  }, [appsList, sort]);

  const filtered = useMemo(() => {
    const fq = q.toLowerCase();
    const filteredApps = sortedApps.filter((a) => a.appName.toLowerCase().includes(fq));
    const totalPages = Math.ceil(filteredApps.length / perPage);
    const paged = filteredApps.slice((page - 1) * perPage, page * perPage);
    return { filteredApps, paged, totalPages };
  }, [sortedApps, q, page, perPage]);

  useEffect(() => {
    if (page > filtered.totalPages && filtered.totalPages > 0) setPage(1);
  }, [page, filtered.totalPages]);

  const navApp = useCallback((url) => {
    if (!url) return;
    sessionStorage.setItem('query', url);
    nav('/indev');
  }, [nav]);

  const handleSearch = useCallback((e) => {
    setQ(e.target.value);
    setPage(1);
  }, []);

  const handleImgError = useCallback(
    (name) => setFallback((prev) => ({ ...prev, [name]: true })),
    []
  );

  const searchBarCls = useMemo(() => clsx(
    theme.appsSearchColor, 
    theme[`theme-${options.theme || 'default'}`]
  ), [options.theme]);

  const placeholder = useMemo(() => `Search ${appsList.length} ${type}`, [appsList.length, type]);

  return (
    <div className={`${styles.appContainer} w-full mx-auto`}>
      <div className="w-full px-4 py-4 flex justify-center mt-3">
        <div className={clsx('relative flex items-center gap-2.5 rounded-[10px] px-3 w-[600px] h-11', searchBarCls)}>
          <Search className="w-4 h-4 shrink-0" />
          <input
            type="text"
            placeholder={placeholder}
            value={q}
            onChange={handleSearch}
            className="flex-1 bg-transparent outline-none text-sm"
          />
          {type !== 'apps' && (
            <div ref={sortRef} className="relative flex items-center">
              <button
                type="button"
                onClick={() => setShowSort((s) => !s)}
                className="flex items-center gap-1 text-xs md:text-sm rounded-md px-2 py-1 h-7 cursor-pointer
                           bg-[#ffffff10] hover:bg-[#ffffff18] active:bg-[#ffffff25] border border-white/15"
              >
                <span className="capitalize hidden sm:inline">
                  {SORT_OPTIONS.find((o) => o.value === sort)?.label}
                </span>
                <ChevronDown size={14} className={showSort ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
              {showSort && (
                <ul className={clsx('absolute right-0 top-[calc(100%+0.5rem)] z-20 w-44 rounded-md border border-white/15 shadow-lg p-1', searchBarCls)} role="listbox">
                  {SORT_OPTIONS.map(({ value, label }) => (
                    <li
                      key={value}
                      role="option"
                      aria-selected={sort === value}
                      onClick={() => { setSort(value); setShowSort(false); setPage(1); }}
                      className="px-2 py-1.5 rounded text-[0.8rem] cursor-pointer transition-colors text-inherit hover:bg-[#ffffff12]"
                    >
                      {label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-center pb-2">
        {filtered.paged.map((app) => (
          <div
            key={app.appName}
            className={clsx(
              styles.app,
              theme.appItemColor,
              theme[`theme-${options.theme || 'default'}`],
              app.disabled ? 'disabled cursor-not-allowed' : 'cursor-pointer'
            )}
            onClick={!app.disabled ? () => navApp(app.url) : undefined}
          >
            <div className="w-20 h-20 rounded-[12px] mb-4 overflow-hidden">
              {fallback[app.appName] ? <LayoutGrid className="w-full h-full" /> : (
                <img
                  src={app.icon}
                  draggable="false"
                  className="w-full h-full object-cover"
                  onError={() => handleImgError(app.appName)}
                />
              )}
            </div>
            <p className="text-m font-semibold">{app.appName.split('').join('\u200B')}</p>
            <p className="text-sm mt-2">{(app.desc || '').split('').join('\u200B')}</p>
          </div>
        ))}
      </div>

      {filtered.filteredApps.length > perPage && (
        <div className="flex flex-col items-center pb-7">
          <Pagination
            count={filtered.totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            shape="rounded"
            variant="outlined"
            sx={{
              '& .MuiPaginationItem-root': {
                color: options.paginationTextColor || '#9baec8',
                borderColor: options.paginationBorderColor || '#ffffff1c',
                backgroundColor: options.paginationBgColor || '#141d2b',
                fontFamily: 'SFProText',
              },
              '& .Mui-selected': {
                backgroundColor: `${options.paginationSelectedColor || '#75b3e8'} !important`,
                color: '#fff !important',
              },
            }}
          />
        </div>
      )}
    </div>
  );
});

Apps.displayName = 'Apps';

const AppLayout = ({ type }) => {
  const { options } = useOptions();
  const scrollCls = clsx(
    'scrollbar scrollbar-thin scrollbar-track-transparent',
    !options?.type || options.type === 'dark'
      ? 'scrollbar-thumb-gray-600'
      : 'scrollbar-thumb-gray-500'
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Nav />
      <div className={clsx('flex-1 overflow-y-auto', scrollCls)}>
        <Apps type={type} />
      </div>
    </div>
  );
};

export default AppLayout;
