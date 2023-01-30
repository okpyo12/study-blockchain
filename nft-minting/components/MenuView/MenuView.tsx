import styled from "@emotion/styled";
import React, { HTMLAttributes } from "react";

export const MenuView = ({
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return <View {...props}>{children}</View>;
};

const View = styled.div`
  display: flex;
  flex-direction: column;

  padding: 24px;
  border-radius: 12px;
  background: #88888820;

  width: 500px;
`;
