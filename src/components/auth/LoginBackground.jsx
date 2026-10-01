import './LoginBackground.css'
import backgroundPageLogin from '../../assets/backgrounPageLogin.jpg'
import ContentLogin from './ContentLogin'
import FireSparks from './FireSparks'
function LoginBackground({ children }) {
    return (
        <main
            className="login-background"
            style={{ '--login-background-image': `url(${backgroundPageLogin})` }}
        >
            <div className="login-background__shade" aria-hidden="true" />
            <FireSparks />
            <div className="login-background__content">
                <ContentLogin />
            </div>
            <div className="login-background__edge" aria-hidden="true" />
        </main>
    )
}

export default LoginBackground
