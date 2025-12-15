"use client";
import React from "react";
import Image from "next/image";

export default function SignUp() {
  return (
    <div className="bg-[linear-gradient(297deg,rgba(170,209,240,1)_0%,rgba(86,191,252,1)_40%,rgba(80,106,178,1)_100%)] w-full min-w-[1440px] min-h-[1024px] relative">
      {/* Right white panel */}
      <div className="absolute top-0 right-0 w-[514px] h-full bg-white">
        {/* Email field */}
        <div className="absolute top-[215px] left-[100px] w-[316px] h-[75px]">
          <Image
            src="/email-rectangle.png"
            alt="Email rectangle"
            width={313}
            height={49}
            className="absolute top-[26px] left-0 rounded-md"
          />
          <div className="absolute top-10 left-2.5 font-[Poppins] text-[#000000b2] text-base">
            example@gmail.com
          </div>
          <div className="absolute top-0 left-[calc(50%-141px)] w-[54px] font-[Poppins] text-[#695b5b] text-sm text-center">
            Email
          </div>
        </div>

        {/* Password field */}
        <div className="absolute top-[310px] left-[100px] w-[316px] h-[74px]">
          <div className="absolute top-[26px] left-0 w-[312px] h-12 bg-[#ffffff14] rounded-[10px] border border-[#00000066]" />
          <div className="absolute top-[39px] left-2.5 font-[Poppins] text-[#000000b2] text-base">
            Enter Your Password
          </div>
          <div className="absolute top-[43px] left-[279px] w-[18px] h-[18px]">
            <Image src="/vector.svg" alt="Vector" width={6} height={6} className="absolute top-[34%] left-[34%]" />
            <Image src="/image.svg" alt="Password icon" width={18} height={12} className="absolute top-[16%]" />
          </div>
          <div className="absolute top-0 left-[calc(50%-138px)] w-[78px] font-[Poppins] text-[#695b5b] text-sm text-center">
            Password
          </div>
        </div>

        {/* Remember me + Forgot password */}
        <div className="absolute w-[60%] top-[39.8%] left-[20.5%]">
          <div className="absolute w-[36%] top-[25%] left-[9.5%] font-[Manrope] font-semibold text-[#000c14] text-[15px]">
            Remember Me
          </div>
          <div className="absolute top-[25%] left-0 w-[18px] h-[18px] bg-white rounded-[5px] border border-[#cdd1e0]" />
          <Image src="/tick.svg" alt="Tick" width={12} height={12} className="absolute top-[42%] left-[3px]" />
          <div className="absolute top-0 left-[173px] font-[Poppins] font-medium text-[#e76969] text-[15px]">
            Forgot Password?
          </div>
        </div>

        {/* Login button */}
        <button className="absolute top-[462px] left-[101px] w-[314px] h-12 relative">
          <div className="absolute inset-0 bg-[#0d63d1] rounded-[5px]" />
          <span className="absolute top-[11px] left-[134px] font-[Poppins] font-semibold text-white text-base">
            Login
          </span>
        </button>

        {/* Divider */}
        <div className="absolute top-[586px] left-[98px] w-80 h-[27px] flex gap-2.5 items-center">
          <Image src="/line-1.svg" alt="Divider line" width={116} height={1} />
          <div className="font-[Poppins] text-[#000000cc] text-lg">Or With</div>
          <Image src="/line-2.svg" alt="Divider line" width={116} height={1} />
        </div>

        {/* Facebook login */}
        <div className="absolute top-[646px] left-[100px] w-[314px] h-12 relative">
          <div className="absolute inset-0 bg-[#1877f2] rounded-[10px]" />
          <Image src="/facebook-logo.png" alt="Facebook logo" width={26} height={26} className="absolute top-2.5 left-[9px]" />
          <span className="absolute top-[11px] left-[77px] font-[Poppins] font-semibold text-white text-base">
            Login with Facebook
          </span>
        </div>

        {/* Google login */}
        <div className="absolute top-[715px] left-[100px] w-[314px] h-12 relative">
          <div className="absolute inset-0 bg-[#ffffff05] rounded-[10px] border border-[#00000066]" />
          <Image src="/google-logo.png" alt="Google logo" width={26} height={26} className="absolute top-[11px] left-2" />
          <span className="absolute top-[11px] left-[86px] font-[Poppins] font-semibold text-[#00000099] text-base">
            Login with Google
          </span>
        </div>

        {/* Sign up link */}
        <div className="absolute top-[810px] left-[180px] flex gap-2 text-base font-[Manrope] font-semibold">
          <p className="text-[#0d0d0d]">Don’t have an account?</p>
          <a href="/auth/signup" className="text-[#160062] hover:underline">
            Sign Up
          </a>
        </div>
      </div>

      {/* Left greeting */}
      <div className="absolute top-[65px] left-[calc(50%-490px)] w-[466px] font-[Radley] text-white text-5xl text-center">
        Hi, Welcome Back! 👋
      </div>
    </div>
  );
}
  