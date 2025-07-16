import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface CountdownProps {
  code: string;
}

export default function Countdown({ code }: CountdownProps) {
  const [, setLocation] = useLocation();
  const [countdownNumber, setCountdownNumber] = useState(3);
  const [countdownText, setCountdownText] = useState("Get ready...");

  const { data } = useQuery({
    queryKey: ["/api/rooms", code],
    refetchInterval: 500,
  });

  useEffect(() => {
    if (data?.room?.status === "playing") {
      setLocation(`/room/${code}/game`);
    }
  }, [data?.room?.status, code, setLocation]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdownNumber(prev => {
        if (prev > 1) {
          return prev - 1;
        } else {
          setCountdownText("Go!");
          return 1;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-sm mx-auto min-h-screen bg-primary">
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <div className="text-9xl font-bold mb-4 animate-ping">{countdownNumber}</div>
          <p className="text-xl">{countdownText}</p>
        </div>
      </div>
    </div>
  );
}
