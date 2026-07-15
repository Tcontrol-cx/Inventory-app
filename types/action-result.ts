// types/action-result.ts

export type ActionSuccess<T> = {
  success: true;
  data: T;
};

export type ActionError = {
  success: false;
  error: string;
};

export type ActionResult<T> = ActionSuccess<T> | ActionError;