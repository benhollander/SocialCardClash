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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/join" component={JoinRoom} />
      <Route path="/create" component={CreateRoom} />
      <Route path="/room/:code" component={WaitingRoom} />
      <Route path="/room/:code/game" component={Game} />
      <Route path="/room/:code/countdown" component={Countdown} />
      <Route path="/room/:code/win" component={Win} />
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
