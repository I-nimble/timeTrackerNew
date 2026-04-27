export class Loader {
  constructor(
    public started = false,
    public complete = false,
    public error = false,
  ) {}
}
export const userRoles = {
  admin: '1',
  user: '2',
  employer: '3',
  support: '4',
};
