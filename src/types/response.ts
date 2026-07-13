export type ResposeType<D> = {
  code: number;
  data: D;
  message: string;
};
