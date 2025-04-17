import AuthForm from '@/components/auth/AuthForm'

export default function AuthPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Авторизация в CityStep</h1>
      <AuthForm />
    </div>
  )
}
