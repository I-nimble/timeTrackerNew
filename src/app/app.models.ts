export class Loader {
  constructor(
    public started: boolean = false,
    public complete: boolean = false,
    public error: boolean = false
  ) {}
}
export const userRoles = {
  admin: '1',
  user: '2',
  employer: '3',
  support: '4',
};
