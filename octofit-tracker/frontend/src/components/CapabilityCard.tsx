import type { ReactNode } from 'react';
import { useApiData } from '../api/useApiData.js';

type Props<T> = {
  title: string;
  description: string;
  path: string;
  load: (path: string) => Promise<T>;
  emptyMessage: string;
  select: (data: T) => unknown[] | undefined;
  renderItem: (item: any, index: number) => ReactNode;
};

export function CapabilityCard<T>({ title, description, path, load, emptyMessage, select, renderItem }: Props<T>) {
  const state = useApiData<T>(path, load);
  const items = state.status === 'success' ? select(state.data) ?? [] : [];
  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">{title}</h2>
        <p>{description}</p>
        {state.status === 'loading' && <p role="status">Loading {title.toLowerCase()}…</p>}
        {state.status === 'error' && <p role="alert" className="text-danger">Unable to load {title.toLowerCase()}: {state.message}</p>}
        {state.status === 'success' && items.length === 0 && <p>{emptyMessage}</p>}
        {state.status === 'success' && items.length > 0 && <ul className="list-group">{items.map((item, i) => <li className="list-group-item" key={i}>{renderItem(item, i)}</li>)}</ul>}
      </div>
    </section>
  );
}
