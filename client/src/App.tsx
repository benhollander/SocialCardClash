import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import JoinRoom from "@/pages/join-room";
import CreateRoom from "@/pages/create-room";
import WaitingRoom from "@/pages/waiting-room";
import Game from "@/pages/game";
import Countdown from "@/pages/countdown";
import Win from "@/pages/win";
import FirebaseSetup from "@/pages/firebase-setup";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/join" component={JoinRoom} />
      <Route path="/create" component={CreateRoom} />
      <Route path="/firebase-setup" component={FirebaseSetup} />
      <Route path="/room/:code" component={(props) => <WaitingRoom code={props.params.code} />} />
      <Route path="/room/:code/game" component={(props) => <Game code={props.params.code} />} />
      <Route path="/room/:code/countdown" component={(props) => <Countdown code={props.params.code} />} />
      <Route path="/room/:code/win" component={(props) => <Win code={props.params.code} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
