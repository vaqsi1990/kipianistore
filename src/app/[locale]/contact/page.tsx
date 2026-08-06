"use client";

import { Link } from "@/i18n/navigation";
import React, { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

function ContactPage() {
  const t = useTranslations("contact");

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState("");

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitMessage("");

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus('success');
        setSubmitMessage(data.message);
        // Reset form on success
        setFormData({
          fullName: "",
          email: "",
          phone: "",
          subject: "",
          message: ""
        });
      } else {
        setSubmitStatus('error');
        setSubmitMessage(data.error || 'Something went wrong. Please try again.');
      }
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage('Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <div className="relative min-h-[400px] flex items-center justify-center bg-overlay p-14 sm:p-16 before:bg-title before:bg-opacity-70 overflow-hidden">
        <Image
          src="/bg.jpg"
          alt="Background"
          fill
          quality={80}
          className="object-cover z-0"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/50 z-10" />
        <div className="relative z-20 text-center w-full max-w-4xl mx-auto px-4">
          <h1 className="text-primary text-xl md:text-[45px] font-normal leading-none text-center capitalize">
            {t("hero.title")}
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-16 md:py-24 ">
        <div className="container mx-auto max-w-7xl px-4">
          {/* Contact Form Section */}
          <div className="grid lg:grid-cols-2 gap-12 mb-12 md:mb-16">
            {/* Contact Image */}
            <div className="order-2 lg:order-1">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-orange-600/20 rounded-2xl transform "></div>
                <Image
                  src="/contact.jpg"
                  alt="Contact Us"
                  width={600}
                  height={500}
                  className="w-full h-[400px] object-cover rounded-2xl shadow-2xl"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-2xl"></div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="order-1 lg:order-2">
              <Card className="border-0 shadow-xl bg-white backdrop-blur-sm">
                <CardContent className="p-8">
                  <div className="mb-8">
                    <h2 className="text-[20px] md:text-3xl font-bold text-black mb-4">
                      {t("breadcrumb.sendMessage")}
                    </h2>
                    <p className="text-black text-lg leading-relaxed">
                      {t("form.description")}
                    </p>
                  </div>

                  {/* Status Messages */}
                  {submitStatus === 'success' && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <p className="text-green-800">{submitMessage}</p>
                    </div>
                  )}

                  {submitStatus === 'error' && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
                      <XCircle className="w-5 h-5 text-red-600" />
                      <p className="text-red-800">{submitMessage}</p>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[18px] font-bold text-black tracking-wide">
                          {t("form.fullName")} *
                        </label>
                        <input
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleInputChange}
                          required
                          className="w-full h-12 px-4 bg-white border-2 border-black rounded-lg text-black transition-all duration-300 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-0 focus:border-black"
                          placeholder={t("form.fullNamePlaceholder")}
                          type="text"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[18px] font-bold text-black tracking-wide">
                          {t("form.email")} *
                        </label>
                        <input
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          className="w-full h-12 px-4 bg-white border-2 border-black rounded-lg transition-all duration-300 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-0 focus:border-black"
                          placeholder={t("form.emailPlaceholder")}
                          type="email"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[18px] font-bold text-black tracking-wide">
                          {t("form.phone")}
                        </label>
                        <input
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="w-full h-12 px-4 bg-white border-2 border-black rounded-lg text-gray-800 transition-all duration-300 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-0 focus:border-black"
                          placeholder={t("form.phonePlaceholder")}
                          type="tel"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[18px] font-bold text-black tracking-wide">
                          {t("form.subject")} *
                        </label>
                        <select
                          name="subject"
                          value={formData.subject}
                          onChange={handleInputChange}
                          required
                          className="w-full h-12 px-4 bg-white border-2 text-gray-400 border-black rounded-lg transition-all duration-300 focus:bg-white focus:outline-none focus:ring-0 focus:border-black"
                        >
                          <option className="text-gray-400" value="">
                            {t("info.selectSubject")}
                          </option>
                          <option className="text-gray-400" value="payment">
                            {t("form.subjectOptions.payment")}
                          </option>
                          <option className="text-gray-400" value="furniture">
                            {t("form.subjectOptions.furniture")}
                          </option>
                          <option className="text-gray-400" value="agreement">
                            {t("form.subjectOptions.agreement")}
                          </option>
                          <option className="text-gray-400" value="carrying">
                            {t("form.subjectOptions.carrying")}
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[18px] font-bold text-black tracking-wide">
                        {t("form.message")} *
                      </label>
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        className="w-full h-32 px-4 py-3 bg-white border-2 border-black rounded-lg text-gray-800 transition-all duration-300 placeholder-gray-400 resize-none focus:bg-white focus:outline-none focus:ring-0 focus:border-black"
                        placeholder={t("form.messagePlaceholder")}
                        rows={5}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-[30%] mx-auto flex justify-center items-center px-4 mb-10 py-2 text-[20px] font-bold text-white bg-[#bbb272] rounded-lg  transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        t("form.submit")
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Contact Information Cards */}
            <div className="lg:col-span-1 space-y-6">


              <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#bbb272] rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold  mb-1">
                        {t("info.locations")}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Batumi & Kobuleti */}
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-[16px] text-black font-semibold mb-2"> {t("info.kobuleti")}</h3>
                            <p className="text-[#2E3A47]">
                              {t("info.kobuleti3")}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-[16px] text-black font-bold mb-2">{t("info.kutaisi")}</h3>
                            <p className="text-[#2E3A47]">
                              {t("info.kutaisi3")}
                            </p>
                          </div>


                        </div>

                        {/* Right Column: Tbilisi & Kutaisi */}
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-[16px] text-black font-semibold mb-2">{t("info.tbilisi")}</h3>
                            <p className="text-[#2E3A47]">
                              {t("info.tbilisi3")}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-[16px] text-black font-bold mb-2">{t("info.batumi")}</h3>
                            <div className="text-[#2E3A47]">
                              {t("info.batumi4")}
                              <p className="text-[#2E3A47] text-[16px]">
                                {t("info.batumi3")}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#bbb272] rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-1">
                        {t("info.email")}
                      </h3>
                      <a
                        href="mailto:info@sleepandbed.ge"
                        className="text-[#2E3A47] hover:text-orange-700 text-[16px] transition-colors"
                      >
                        kipianistore@gmail.com
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#bbb272] rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-semibold  mb-1">
                        {t("info.call")}
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Column: Batumi & Kobuleti */}
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-[16px] text-black font-semibold mb-2">{t("info.batumi2")}</h3>
                            <p className="text-[#2E3A47]">
                              +995 557 394 374<br />
                              +995 568 613 022
                            </p>
                          </div>
                          <div>
                            <h3 className="text-[16px] text-black font-bold mb-2">{t("info.tbilisi2")}</h3>
                            <p className="text-[#2E3A47]">
                              +995 557 226 880
                            </p>
                          </div>


                        </div>

                        {/* Right Column: Tbilisi & Kutaisi */}
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-[16px] text-black font-semibold mb-2">{t("info.kobuleti2")}</h3>
                            <p className="text-[#2E3A47]">
                              +995 555 244 403<br />
                              +995 597 808 047
                            </p>
                          </div>
                          <div>
                            <h3 className="text-[16px] text-black font-bold mb-2">{t("info.kutaisi2")}</h3>
                            <p className="text-[#2E3A47]">
                              +995 514 079 898
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Map Section */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative h-[400px] md:h-[590px]">
                    <iframe
                      className="w-full h-full"
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2933.203682968321!2d41.6285049!3d41.6399867!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40678700245cd783%3A0xa1c772006499c03c!2sSleep%26Bed%20Georgia!5e0!3m2!1sen!2s!4v1712549012345"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default ContactPage;
