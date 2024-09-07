import './style.css'
// engine
import { initEngine } from './render/init'
// app
import startApp from './app';


(async () => {
  await initEngine()
  await startApp()
})()