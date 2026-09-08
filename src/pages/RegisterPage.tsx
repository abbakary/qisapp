import React from "react";
import AuthFlow from "../components/AuthFlow";

export default function RegisterPage() {
  return <AuthFlow initialStep="IDENTIFIER_CHECK" />;
}
