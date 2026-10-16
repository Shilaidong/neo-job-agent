/**
 * Consultants keep working notes next to the student's documents, and the notes sometimes hold a mailbox
 * password. The text version is what the (cloud) model reads, so the value is blanked there; the original
 * file is never touched. Only "password: value" with an explicit separator — "平台没有密码，用验证码登录"
 * is a sentence, not a secret.
 */
const SECRET = /(密码|口令|password|passwd|passcode|pwd)(\s*[:：=]\s*)(\S+)/gi

export function redactSecrets(text: string): { text: string; found: number } {
  let found = 0
  const out = text.replace(SECRET, (_all, word: string, separator: string) => {
    found++
    return `${word}${separator}［已隐去］`
  })
  return { text: out, found }
}

export const SECRET_NOTE = "这份材料里写着密码，文字版里已隐去。密码不该放在学生材料里，建议顾问从原文件里拿掉"
