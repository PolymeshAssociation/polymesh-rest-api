// eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-explicit-any
type Class<T extends {} = {}> = new (...args: any[]) => T;
