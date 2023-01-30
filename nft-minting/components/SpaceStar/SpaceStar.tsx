import React, { useRef } from "react";
import { Stars } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

export const SpaceStar = () => {
  const starRef = useRef<any>();

  useFrame(() => {
    if (starRef.current) {
      starRef.current.rotation.y += 0.00015;
    }
  });

  return <Stars ref={starRef} />;
};
