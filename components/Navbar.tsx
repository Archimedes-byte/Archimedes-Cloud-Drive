"use client"

import { signIn, useSession } from "next-auth/react"
import { Button } from "./ui/button"
import { usePathname } from "next/navigation"

export function Navbar() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // 在首页、登录和注册页面不显示导航栏
  if (pathname === '/' || pathname === '/auth/login' || pathname === '/auth/register') {
    return null
  }

  // 在加载状态时不显示任何内容
  if (status === "loading") {
    return null
  }

  if (session) {
    return null // 登录后不显示导航栏
  }

  return (
    <nav className="border-b bg-white shadow-sm">
      <div className="container flex h-16 items-center px-6">
        <div className="ml-auto flex items-center">
          <Button 
            onClick={() => signIn("github", { 
              callbackUrl: `${window.location.origin}/file_management/main`,
              redirect: true
            })}
            className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-6"
          >
            登录
          </Button>
        </div>
      </div>
    </nav>
  )
} 