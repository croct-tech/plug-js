import {Configuration, Plug, GlobalPlug} from './plug';

export type {Configuration, Plug};

const plug = new GlobalPlug();

export {plug};

/* eslint-disable-next-line import/no-default-export -- Should be default export */
export default plug;
