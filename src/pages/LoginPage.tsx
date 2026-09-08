import React from "react";
import AuthFlow from "../components/AuthFlow";

export default function LoginPage() {
  return <AuthFlow initialStep="IDENTIFIER_CHECK" />;
}
