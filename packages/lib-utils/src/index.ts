export { UtilsConfig, setUtilsConfig, getUtilsConfig } from './config';
export { commonFetch, commonFetchText, commonFetchJSON } from './utils/common-fetch';
export {
  k8sGet,
  k8sCreate,
  k8sUpdate,
  k8sPatch,
  k8sDelete,
  k8sList,
  k8sListItems,
} from './k8s/k8s-resource';
