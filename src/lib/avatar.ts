export function getDefaultAvatar(seed: string, bgColor: string = 'b6e3f4') {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(seed || 'User')}&background=${bgColor}&color=fff&size=128&bold=true`;
}
