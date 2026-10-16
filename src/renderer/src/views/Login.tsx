import { createSignal, Show } from "solid-js"

const neo = window.neo

export function Login(props: { contactWechat: string }) {
  const [email, setEmail] = createSignal("")
  const [password, setPassword] = createSignal("")
  const [busy, setBusy] = createSignal(false)
  const [error, setError] = createSignal("")

  const submit = async (event: Event) => {
    event.preventDefault()
    if (busy() || !email().trim() || !password()) return
    setBusy(true)
    setError("")
    try {
      await neo.login(email().trim(), password())
    } catch (err) {
      setError(cleanIpcError(err))
    } finally {
      setPassword("")
      setBusy(false)
    }
  }

  return (
    <div class="center">
      <form class="panel login" onSubmit={submit}>
        <p class="kicker">Terra-Edu</p>
        <h1>登录后即可调用 AI</h1>
        <p class="muted">用你的 Terra-Edu 顾问账号登录。AI 额度跟着账号走。</p>
        <label class="field">
          <span>邮箱</span>
          <input type="email" autocomplete="username" placeholder="consultant@terra.edu" value={email()} onInput={(e) => setEmail(e.currentTarget.value)} autofocus />
        </label>
        <label class="field">
          <span>密码</span>
          <input type="password" autocomplete="current-password" placeholder="请输入密码" value={password()} onInput={(e) => setPassword(e.currentTarget.value)} />
        </label>
        <Show when={error()}><div class="error">{error()}</div></Show>
        <button class="primary big" type="submit" disabled={busy() || !email().trim() || !password()}>{busy() ? "正在登录…" : "登录"}</button>
        <p class="muted small">没有账号或额度用完了？联系微信：{props.contactWechat}</p>
      </form>
    </div>
  )
}

/** Electron prefixes errors thrown across IPC; the consultant only needs the sentence. */
export function cleanIpcError(err: unknown) {
  const text = err instanceof Error ? err.message : String(err)
  return text.replace(/^Error invoking remote method '[^']+': (Error: )?/, "")
}
