import { Menu } from "../../models/Menu";
let ADMIN_TYPE_ROLE = '1'
let USER_TYPE_ROLE = '2'
let CLIENT_TYPE_ROLE = '3'

export const navigationItems = [
    // dashboard links
    new Menu (1, 'dashboard', '/dashboard', null, [USER_TYPE_ROLE], null, true),
    new Menu (2, 'dashboard', '/admin/dashboard', null, [ADMIN_TYPE_ROLE], null, true),
    new Menu (3, 'dashboard', '/client', null, [CLIENT_TYPE_ROLE], null, true),
    // entries
    new Menu (4, 'entries', '/user/entries', null, [USER_TYPE_ROLE, ADMIN_TYPE_ROLE], null, true),
    // reports
    new Menu (5, 'reports', '/reports', null, [ADMIN_TYPE_ROLE, USER_TYPE_ROLE, CLIENT_TYPE_ROLE], null, true),
    new Menu (6, 'login', '/login', null, [null], null, false),
    new Menu (6, 'logout', '/logout', null, [null], null, true),
]