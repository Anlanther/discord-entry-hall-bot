import { GuildMember, PermissionsBitField } from "discord.js";

export function canManageMessages(member: GuildMember): boolean {
  if (!member.guild.members.me) return false;
  const me = member.guild.members.me;
  return me.permissions.has(PermissionsBitField.Flags.ManageMessages);
}

export function canManageRoles(member: GuildMember): boolean {
  if (!member.guild.members.me) return false;
  const me = member.guild.members.me;
  return me.permissions.has(PermissionsBitField.Flags.ManageRoles);
}

export function canKickMembers(member: GuildMember): boolean {
  if (!member.guild.members.me) return false;
  const me = member.guild.members.me;
  return me.permissions.has(PermissionsBitField.Flags.KickMembers);
}
