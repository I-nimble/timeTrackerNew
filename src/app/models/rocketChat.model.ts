export interface RocketChatCredentials {
  authToken: string;
  userId: string;
}

export interface RocketChatLoginResponse {
  status: string;
  data: {
    authToken: string;
    userId: string;
    me: RocketChatUser;
  };
}

export interface RocketChatApiResponse {
  success: boolean;
  error?: string;
  errorType?: string;
}

export interface RocketChatUserEmail {
  address: string;
  verified: boolean;
}

export interface RocketChatUserPreferences {
  [key: string]: any;
}

export interface RocketChatUserSettings {
  preferences?: RocketChatUserPreferences;
}

export interface RocketChatUser {
  _id: string;
  createdAt?: string;
  username: string;
  emails?: RocketChatUserEmail[];
  type?: string;
  status?: string;
  statusConnection?: string;
  active?: boolean;
  roles?: string[];
  name?: string;
  requirePasswordChange?: boolean;
  lastLogin?: string;
  utcOffset?: number;
  canViewAllInfo?: boolean;
  settings?: RocketChatUserSettings;
  avatarUrl?: string;
}

export interface RocketChatUserResponse extends RocketChatApiResponse {
  user: RocketChatUser;
}

export interface RocketChatMessageUser {
  _id: string;
  username: string;
  name?: string;
}

export interface RocketChatReaction {
  usernames: string[];
}

export interface RocketChatMessageReactions {
  [emoji: string]: RocketChatReaction;
}

export interface RocketChatMention {
  _id?: string;
  username?: string;
  name?: string;
  type?: string;
}

export interface RocketChatChannelMention {
  _id?: string;
  name?: string;
}

export interface RocketChatMessageAttachmentImageDimensions {
  width: number;
  height: number;
}

export interface RocketChatMessageAttachment {
  ts?: string;
  title?: string;
  title_link?: string;
  title_link_download?: boolean;
  image_dimensions?: RocketChatMessageAttachmentImageDimensions;
  image_preview?: string;
  image_url?: string;
  image_type?: string;
  image_size?: number;
  video_url?: string;
  audio_url?: string;
  type?: string;
  description?: string;
}

export interface RocketChatMessageFile {
  _id: string;
  name: string;
  type: string;
}

export interface RocketChatUrlMeta {
  [key: string]: any;
}

export interface RocketChatMessageUrl {
  url: string;
  meta?: RocketChatUrlMeta;
}

export interface RocketChatMessageMarkdownElement {
  type: string;
  value: string | RocketChatMessageMarkdownElement[];
}

export interface RocketChatMessage {
  _id: string;
  rid: string;
  msg: string;
  alias?: string;
  ts: string | { $date: string | number };
  u: RocketChatMessageUser;
  _updatedAt: string;
  reactions?: RocketChatMessageReactions;
  mentions?: RocketChatMention[];
  channels?: RocketChatChannelMention[];
  starred?: {
    _id: string;
  };
  t?: string;
  groupable?: boolean;
  attachments?: RocketChatMessageAttachment[];
  file?: RocketChatMessageFile;
  urls?: RocketChatMessageUrl[];
  md?: RocketChatMessageMarkdownElement[];
  drid?: string;
}

export interface RocketChatMessageResponse extends RocketChatApiResponse {
  message: RocketChatMessage;
}

export interface RocketChatMessagesResponse extends RocketChatApiResponse {
  messages: RocketChatMessage[];
}

export interface RocketChatRoomLastMessage extends RocketChatMessage {}

export interface RocketChatRoom {
  _id: string;
  ts?: string;
  t: string;
  name?: string;
  fname?: string;
  usernames?: string[];
  msgs?: number;
  usersCount?: number;
  _updatedAt?: string;
  u?: RocketChatMessageUser;
  default?: boolean;
  lastMessage?: RocketChatRoomLastMessage;
  lm?: string;
  uids?: string[];
  ro?: boolean;
  sysMes?: boolean;
  topic?: string;
  description?: string;
  announcement?: string;
  broadcast?: boolean;
  encrypted?: boolean;
  teamId?: string;
  teamMain?: boolean;
}

export interface RocketChatRoomsResponse extends RocketChatApiResponse {
  update: RocketChatRoom[];
  remove?: any[];
}

export interface RocketChatChannel extends RocketChatRoom {
  t: 'c';
}

export interface RocketChatDirectMessage extends RocketChatRoom {
  t: 'd';
}

export interface RocketChatPrivateGroup extends RocketChatRoom {
  t: 'p';
}

export interface RocketChatLoginRequest {
  user: string;
  password: string;
}

export interface RocketChatSendMessageRequest {
  channel: string;
  text: string;
  alias?: string;
  emoji?: string;
  avatar?: string;
  attachments?: RocketChatMessageAttachment[];
}

export interface RocketChatCreateChannelRequest {
  name: string;
  members?: string[];
  readOnly?: boolean;
  extraData?: {
    [key: string]: any;
  };
}

export interface RocketChatCreateDirectMessageRequest {
  username: string;
}

export interface RocketChatUpdateRoomRequest {
  roomId: string;
  name?: string;
  topic?: string;
  description?: string;
  announcement?: string;
  readOnly?: boolean;
  reactWhenReadOnly?: boolean;
  archived?: boolean;
}

export interface RocketChatJoinChannelRequest {
  roomId: string;
  joinCode?: string;
}

export interface RocketChatLeaveChannelRequest {
  roomId: string;
}

export interface RocketChatInviteToChannelRequest {
  roomId: string;
  userId: string;
}

export interface RocketChatKickFromChannelRequest {
  roomId: string;
  userId: string;
}

export interface RocketChatSubscription {
  _id: string;
  open: boolean;
  alert: boolean;
  unread: number;
  userMentions: number;
  groupMentions: number;
  ts: string;
  rid: string;
  name: string;
  fname: string;
  t: string;
  u: RocketChatMessageUser;
  _updatedAt: string;
  ls: string;
  lr: string;
  tunread: string[];
  tunreadUser: string[];
  tunreadGroup: string[];
  roles: string[];
  onHold: boolean;
  encrypted: boolean;
  E2EKey: string;
  unreadAlert: 'all' | 'mentions' | 'nothing';
  f: boolean;
  prid: string;
}

export interface RocketChatSubscriptionsResponse extends RocketChatApiResponse {
  update: RocketChatSubscription[];
}

export interface RocketChatFileUpload {
  _id: string;
  name: string;
  size: number;
  type: string;
  rid: string;
  userId: string;
  store: string;
  complete: boolean;
  uploading: boolean;
  progress: number;
  extension: string;
  uploadedAt: string;
  url: string;
}

export interface RocketChatFileUploadResponse extends RocketChatApiResponse {
  file: RocketChatFileUpload;
}

export interface RocketChatPresence {
  _id: string;
  username: string;
  name?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  utcOffset?: number;
}

export interface RocketChatPresenceResponse extends RocketChatApiResponse {
  users: RocketChatPresence[];
}

export interface RocketChatTeam {
  _id: string;
  name: string;
  type: number;
  roomId: string;
  createdBy: RocketChatMessageUser;
  createdAt: string;
  _updatedAt: string;
}

export interface RocketChatTeamsResponse extends RocketChatApiResponse {
  teams: RocketChatTeam[];
}

export interface RocketChatSearchMessage {
  _id: string;
  rid: string;
  msg: string;
  ts: string;
  u: RocketChatMessageUser;
  _updatedAt: string;
  score?: number;
}

export interface RocketChatSearchMessagesResponse extends RocketChatApiResponse {
  messages: RocketChatSearchMessage[];
}

export {
  RocketChatCredentials as CometChatCredentials,
  RocketChatUser as CometChatUser,
  RocketChatMessage as CometChatMessage,
  RocketChatRoom as CometChatRoom,
};