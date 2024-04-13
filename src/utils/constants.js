const INTERNAL_SERVER_ERROR_MESSAGE = "Oops, something went wrong!";

const UserRoles = {
  ADMIN: "ADMIN",
  MEMBER: "MEMBER"
};

const UserStatus = {
  INVITED: "INVITED",
  ACTIVE: "ACTIVE",
  BLOCKED: "BLOCKED"
};

const ChannelType = {
  Twitter: "Twitter",
  Facebook: "Facebook",
  Instagram: "Instagram",
  LinkedIn: "LinkedIn",
  Reddit: "Reddit"
};

module.exports = {
  INTERNAL_SERVER_ERROR_MESSAGE,
  UserRoles,
  UserStatus,
  ChannelType
};
