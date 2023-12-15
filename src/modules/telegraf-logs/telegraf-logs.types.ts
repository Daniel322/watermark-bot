export type TelegrafLogOptions = {
  id: number;
  is_bot: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
  action: TelegrafLogAction;
};

export type TelegrafLogAction = 'start' | 'finish';
