export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) {
    return email;
  }
  const visible = local.length <= 3 ? local : local.slice(0, 3);
  return `${visible}***@${domain}`;
}
