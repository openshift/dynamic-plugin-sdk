import { CustomError } from '@openshift/dynamic-plugin-sdk';
import type { K8sStatus } from '../types/k8s';

/**
 * Error class used when Kubernetes cannot handle a request.
 */
export class K8sStatusError extends CustomError {
  public statusObject: K8sStatus;

  constructor(statusObject: K8sStatus) {
    super(statusObject.message);
    this.statusObject = statusObject;
  }
}
