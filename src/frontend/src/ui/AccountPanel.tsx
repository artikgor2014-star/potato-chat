import { TwitchLogout, TwitchStartLogin } from '@bindings/potato-chat/app.js';
import { Browser } from '@wailsio/runtime';
import { useTranslation } from 'react-i18next';

import { useAuthStore } from '@/stores/auth';
import { Icon } from '@/ui/Icon';

/**
 * Twitch account block. Followers and channel point redemptions both arrive
 * over EventSub, which needs a user token — reading chat does not, so this
 * stays optional and clearly separated from the channel field.
 */
export function AccountPanel() {
    const { t } = useTranslation();
    const status = useAuthStore((s) => s.status);
    const login = useAuthStore((s) => s.login);
    const pending = useAuthStore((s) => s.pending);

    const connected = status === 'connected';

    return (
        <section className="panel">
            <div className="panel__head">
                <span className="panel__title">{t('account.title')}</span>
                <span className={`chip${connected ? '' : ' chip--muted'}`}>
                    <span
                        className="dot"
                        data-on={connected}
                    />
                    {connected ? login : t('account.disconnected')}
                </span>
            </div>

            {connected ? (
                <>
                    <span className="field__hint">{t('account.connected_hint')}</span>
                    <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => void TwitchLogout()}
                    >
                        <Icon
                            name="logout"
                            size={14}
                        />
                        {t('account.logout')}
                    </button>
                </>
            ) : pending ? (
                <>
                    <span className="field__hint">{t('account.code_hint')}</span>
                    <div className="code">{pending.userCode}</div>
                    <button
                        className="btn btn--primary btn--sm"
                        onClick={() => void Browser.OpenURL(pending.verificationUri)}
                    >
                        <Icon
                            name="external"
                            size={14}
                        />
                        {t('account.open_twitch')}
                    </button>
                </>
            ) : (
                <>
                    <span className="field__hint">{t('account.disconnected_hint')}</span>
                    <button
                        className="btn btn--ghost btn--sm"
                        onClick={() => void TwitchStartLogin()}
                    >
                        <Icon
                            name="twitch"
                            size={14}
                            filled
                        />
                        {t('account.connect')}
                    </button>
                </>
            )}
        </section>
    );
}
