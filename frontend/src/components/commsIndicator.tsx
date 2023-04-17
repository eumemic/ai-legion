import styled from '@emotion/styled';
import { css } from '@mui/material/styles';
import React, { useState, useEffect } from 'react';
import { Message } from '../types/message';

interface CircleProps {
  message: Message | null;
}

const StyledCommsIndicator = styled.div`
  width: 10px;
  height: 10px;
  border: 1px solid gray;
  border-radius: 50%;
  background-color: transparent;

  ${(props: { isError: boolean; colorFlash: boolean }) =>
    props.colorFlash &&
    css`
      background-color: ${props.isError ? 'red' : 'green'};
    `}
`;

const CommsIndicator = ({ message }: CircleProps) => {
  const [colorFlash, setColorFlash] = useState(false);

  useEffect(() => {
    if (message) {
      setColorFlash(true);
      const timeoutId = setTimeout(() => {
        setColorFlash(false);
      }, 400);

      return () => clearTimeout(timeoutId);
    }
  }, [message]);

  useEffect(() => {
    console.log('colorFlash', colorFlash);
  }, [colorFlash]);

  return (
    <StyledCommsIndicator
      isError={message?.type === 'error' ? true : false}
      colorFlash={colorFlash}
    ></StyledCommsIndicator>
  );
};

export default CommsIndicator;
