import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface InterviewStepProps {
    question: string;
    description?: string;
    children?: React.ReactNode;
}

export function InterviewStep({ question, description, children }: InterviewStepProps) {
    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={question}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="w-full h-full flex flex-col justify-center"
            >
                <Card className="border-none shadow-none bg-transparent">
                    <CardContent className="p-4 space-y-6 text-center">
                        <div className="space-y-2">
                            <motion.h2
                                className="text-2xl font-bold tracking-tight text-primary leading-tight"
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.1 }}
                            >
                                {question}
                            </motion.h2>
                            {description && (
                                <p className="text-muted-foreground text-sm">{description}</p>
                            )}
                        </div>

                        <div className="py-4">
                            {/* Children will be the active input method display or specialized content */}
                            {children}
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}
