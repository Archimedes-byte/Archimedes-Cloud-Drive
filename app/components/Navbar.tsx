"use client"

import { useState } from "react";
import { Avatar, Button, Dropdown, Menu } from "antd";
import { signIn, useSession } from "next-auth/react"
import { usePathname } from "next/navigation"
import { NavbarProps } from "@/app/types"
import { UserOutlined, LogoutOutlined, SearchOutlined, SettingOutlined, UserSwitchOutlined } from "@ant-design/icons";

export function Navbar({ 
  className = "", 
  showLogo = true,
  transparent = false,
  fixed = false
}: NavbarProps) {
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

  // 登录后不显示导航栏
  if (session) {
    return null
  }

  const navClasses = `
    ${transparent ? 'bg-transparent' : 'bg-white border-b shadow-sm'} 
    ${fixed ? 'fixed top-0 left-0 right-0 z-50' : ''}
    ${className}
  `.trim()

  return (
    <nav className={navClasses}>
      <div className="container flex h-16 items-center px-6">
        {showLogo && (
          <div className="flex items-center">
            <span className="text-lg font-semibold">云盘系统</span>
          </div>
        )}
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