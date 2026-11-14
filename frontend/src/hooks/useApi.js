import { useEffect, useState } from 'react';
import { getErrorMessage } from '../services/api';

// Runs `fn` (an axios call) whenever `deps` change. Previous data stays visible while reloading.
export function useApi(fn, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let active = true;
    setState((s) => ({ ...s, loading: true, error: '' }));
    fn()
      .then((res) => active && setState({ data: res.data, loading: false, error: '' }))
      .catch((err) => active && setState({ data: null, loading: false, error: getErrorMessage(err) }));
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, reload: () => setTick((t) => t + 1) };
}
