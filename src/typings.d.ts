/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}

declare module 'ipfs-api';
declare module 'uport-connect';

declare module '*.json' {
  const value: any;
  export default value;
}
