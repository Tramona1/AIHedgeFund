import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
  linkHref?: string;
  linkText?: string;
}

export const FeatureCard = ({
  icon,
  title,
  description,
  className = "",
  linkHref = "/signup",
  linkText = "Learn More"
}: FeatureCardProps) => (
  <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
    <Card className={`h-full transition-all hover:shadow-md border-blue-100 overflow-hidden group ${className}`}>
      <CardHeader className="pb-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
          {icon}
        </div>
        <CardTitle className="text-xl text-blue-900">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-base text-blue-700/70">{description}</CardDescription>
        <div className="mt-6">
          <Link href={linkHref}>
            <Button
              variant="outline"
              size="sm"
              className="border-blue-200 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
            >
              {linkText}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default FeatureCard; 