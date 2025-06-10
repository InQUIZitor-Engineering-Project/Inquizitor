import React from "react";
import {
  CardContainer,
  IconWrapper,
  Title,
  Description,
} from "./HowItWorks.styles";

interface StepCardProps {
  iconSrc: string;
  title: string;
  description: string;
}

const StepCard: React.FC<StepCardProps> = ({ iconSrc, title, description }) => {
  return (
    <CardContainer>
      <IconWrapper>
        <img src={iconSrc} alt={`${title} icon`} />
      </IconWrapper>
      <Title>{title}</Title>
      <Description>{description}</Description>
    </CardContainer>
  );
};

export default StepCard;
