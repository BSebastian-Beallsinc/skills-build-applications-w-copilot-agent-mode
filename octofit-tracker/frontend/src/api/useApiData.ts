import { useEffect, useState } from 'react';

export type ApiState<T> = { status: 'loading' } | { status: 'error'; message: string } | { status: 'success'; data: T };

export function useApiData<T>(path: string, load: (path: string) => Promise<T>): ApiState<T> {
  const [state, setState] = useState<ApiState<T>>({ status: 'loading' });
  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    load(path).then(
      (data) => active && setState({ status: 'success', data }),
      (error: unknown) => active && setState({ status: 'error', message: error instanceof Error ? error.message : 'Unknown error' }),
    );
    return () => { active = false; };
    // load is a stable module-level function such as getJson; path drives refetching.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);
  return state;
}
