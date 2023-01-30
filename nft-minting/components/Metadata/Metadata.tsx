import styled from "@emotion/styled";
import React, { HTMLAttributes } from "react";

interface MetadataProperty {
  trait_type: string;
  value: string;
}

interface MetadataProps extends HTMLAttributes<HTMLDivElement> {
  owner: string;
  properties: MetadataProperty[];
}

export const Metadata = ({ owner, properties }: MetadataProps) => {
  return (
    <PropertyView>
      <PropertyRow>
        <PropertyTitle>owner</PropertyTitle>
        <PropertyValue>{owner}</PropertyValue>
      </PropertyRow>
      {properties.map((property) => (
        <PropertyRow key={`planet-property-${property.trait_type}`}>
          <PropertyTitle>{property.trait_type}</PropertyTitle>
          <PropertyValue>{property.value}</PropertyValue>
        </PropertyRow>
      ))}
    </PropertyView>
  );
};

const PropertyView = styled.div`
  width: 100%;
  font-size: 18px;
  line-height: 36px;
  color: #ccc;
`;

const PropertyRow = styled.div`
  display: flex;
  flex-direction: row;
`;

const PropertyTitle = styled.div`
  flex: 1;
  font-weight: 600;
`;

const PropertyValue = styled.div`
  font-weight: 200;
`;
