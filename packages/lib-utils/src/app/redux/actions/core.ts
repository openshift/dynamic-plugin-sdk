import type { ActionType as Action } from 'typesafe-actions';
import { action } from 'typesafe-actions';
import type { UserKind } from '../../../types/redux';

export enum ActionType {
  SetUser = 'setUser',
  BeginImpersonate = 'beginImpersonate',
  EndImpersonate = 'endImpersonate',
  SetActiveCluster = 'setActiveCluster',
}

export const setUser = (user: UserKind) => action(ActionType.SetUser, { user });
export const beginImpersonate = (kind: string, name: string, subprotocols: string[]) =>
  action(ActionType.BeginImpersonate, { kind, name, subprotocols });
export const endImpersonate = () => action(ActionType.EndImpersonate);
export const setActiveCluster = (cluster: string) =>
  action(ActionType.SetActiveCluster, { cluster });

const coreActions = {
  setUser,
  beginImpersonate,
  endImpersonate,
  setActiveCluster,
};

export type CoreAction = Action<typeof coreActions>;
