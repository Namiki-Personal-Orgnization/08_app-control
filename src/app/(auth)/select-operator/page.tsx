import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OperatorForm } from "./operator-form";
import { UserCircle } from "lucide-react";

export default function SelectOperatorPage() {
  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserCircle className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl">担当者を選択</CardTitle>
        <CardDescription>
          作業ログに記録される名前を入力してください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <OperatorForm />
      </CardContent>
    </Card>
  );
}
