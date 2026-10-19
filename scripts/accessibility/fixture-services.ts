// Only service/store integration is substituted; component markup and hooks are real.
export const getStore = () => (window as any).auditStore;
export const apiAction = (method: string, ...args: any[]) => (window as any).auditService(method, ...args);
export const getSaga = () => ({ run: () => ({ toPromise: async () => ({ payload: (window as any).auditStore.getState().reader.info.publicationView }) }) });
