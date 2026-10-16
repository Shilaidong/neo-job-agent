import { createSignal, Match, onCleanup, onMount, Show, Switch } from "solid-js"
import type { AppState } from "../../shared/types"
import { Home } from "./views/Home"
import { Login } from "./views/Login"
import { Workbench } from "./views/Workbench"

const neo = window.neo

/** Which screen: sign-in → the list of applications → one application (page left, conversation right). */
export function App() {
  const [app, setApp] = createSignal<AppState>({ phase: "starting", view: "home", workspace: "", models: [], arch: "" })
  const [devView, setDevView] = createSignal("")

  onMount(async () => {
    const offs = [neo.on("app:state", (s: AppState) => setApp({ ...s })), neo.on("dev:view", (view: string) => setDevView(view))]
    onCleanup(() => offs.forEach((off) => off()))
    setApp(await neo.getState())
  })

  const needsLogin = () => devView() === "login" || (app().auth?.configured && !app().auth?.authenticated)

  return (
    <Switch>
      <Match when={app().phase === "starting" && app().view === "home"}>
        <div class="center"><p class="hint">正在启动<span class="caret" /></p></div>
      </Match>
      <Match when={app().phase === "failed" && app().view === "home"}>
        <div class="center">
          <div class="error"><strong>没能启动</strong><p>{app().error}</p></div>
          <button onClick={() => neo.revealLog()}>查看日志</button>
        </div>
      </Match>
      <Match when={needsLogin()}>
        <Login contactWechat={app().auth?.contactWechat ?? "shilaidong"} />
      </Match>
      <Match when={app().view === "task"}>
        <Workbench app={app()} setApp={setApp} devView={devView} />
      </Match>
      <Match when={true}>
        <Show when={app().auth}>
          <Home
            startInNewTask={devView() === "new"}
            startInSettings={devView() === "settings"}
            startInAddServer={devView() === "settings-new"}
            startInEdit={devView() === "student"}
          />
        </Show>
      </Match>
    </Switch>
  )
}
