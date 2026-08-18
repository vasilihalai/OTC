import { type FC, type ReactNode, useMemo } from 'react';
import {
  initData,
  type User,
  useSignal,
} from '@tma.js/sdk-react';
import { List, Placeholder } from '@telegram-apps/telegram-ui';

import { DisplayData, type DisplayDataRow } from '@/components/DisplayData/DisplayData.tsx';
import { Page } from '@/components/Page.tsx';

function getUserRows(user: User): DisplayDataRow[] {
  return (Object.entries(user) as [string, ReactNode][]).map(([title, value]) => ({ title, value }));
}

export const InitDataPage: FC = () => {
  const initDataRaw = useSignal(initData.raw);
  const initDataState = useSignal(initData.state);

  const initDataRows = useMemo<DisplayDataRow[] | undefined>(() => {
    if (!initDataState || !initDataRaw) {
      return;
    }
    return [
      { title: 'raw', value: initDataRaw },
      ...(Object.entries(initDataState) as [string, ReactNode][]).reduce<DisplayDataRow[]>((acc, [title, value]) => {
        if (value instanceof Date) {
          acc.push({ title, value: value.toISOString() });
        } else if (!value || typeof value !== 'object') {
          acc.push({ title, value });
        }
        return acc;
      }, []),
    ];
  }, [initDataState, initDataRaw]);

  const userRows = useMemo<DisplayDataRow[] | undefined>(() => {
    return initDataState && initDataState.user
      ? getUserRows(initDataState.user)
      : undefined;
  }, [initDataState]);

  const receiverRows = useMemo<DisplayDataRow[] | undefined>(() => {
    return initDataState && initDataState.receiver
      ? getUserRows(initDataState.receiver)
      : undefined;
  }, [initDataState]);

  const chatRows = useMemo<DisplayDataRow[] | undefined>(() => {
    return !initDataState?.chat
      ? undefined
      : (Object.entries(initDataState.chat) as [string, ReactNode][]).map(([title, value]) => ({ title, value }));
  }, [initDataState]);

  if (!initDataRows) {
    return (
      <Page>
        <Placeholder
          header="Oops"
          description="Application was launched with missing init data"
        >
          <img
            alt="Telegram sticker"
            src="https://xelene.me/telegram.gif"
            style={{ display: 'block', width: '144px', height: '144px' }}
          />
        </Placeholder>
      </Page>
    );
  }
  return (
    <Page>
      <List>
        <DisplayData header={'Init Data'} rows={initDataRows}/>
        {userRows && <DisplayData header={'User'} rows={userRows}/>}
        {receiverRows && <DisplayData header={'Receiver'} rows={receiverRows}/>}
        {chatRows && <DisplayData header={'Chat'} rows={chatRows}/>}
      </List>
    </Page>
  );
};
