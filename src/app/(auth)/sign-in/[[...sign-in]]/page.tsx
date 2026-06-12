import React from 'react'
import { SignIn } from "@clerk/nextjs"
const SignInPage = () => {
  return (
    <div className='flex items-center justify-center min-h-screen bg-black-50'>
      <SignIn />
      </div>
  )
}

export default SignInPage;