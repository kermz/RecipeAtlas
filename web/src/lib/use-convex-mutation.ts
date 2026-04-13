import { useState } from "react";
import { useMutation } from "convex/react";

export function useConvexMutation(functionReference: any) {
  const mutate = useMutation(functionReference);
  const [isPending, setIsPending] = useState(false);

  return {
    isPending,
    async mutateAsync(args?: unknown) {
      setIsPending(true);

      try {
        return await mutate(args);
      } finally {
        setIsPending(false);
      }
    }
  };
}
