import { useParams } from 'react-router-dom';

import { ru } from '@/i18n/ru.ts';

import './Stub.css';

export interface StubProps {
  titlePrefix: string;
  param: string;
}

export function Stub({ titlePrefix, param }: StubProps) {
  const params = useParams();
  const value = params[param];

  return (
    <div className="stub">
      <h1 className="stub__title">{titlePrefix}{value ? ` ${value}` : ''}</h1>
      <p className="stub__body">{ru.stub.inDevelopment}</p>
    </div>
  );
}
