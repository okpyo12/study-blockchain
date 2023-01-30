import styled from "@emotion/styled";
import React, { HTMLAttributes } from "react";

export const Title = ({
  children,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  return <TitleText {...props}>{children}</TitleText>;
};

const TitleText = styled.div`
  margin-bottom: 24px;
  color: #eeeeee;
  font-size: 24px;
  text-align: center;
`;
