import { signInWithEmailAndPassword } from "@firebase/auth";
import { useForm } from "react-hook-form";
import { auth } from "../lib/firebase";
import { useNavigate } from "react-router";
import toast from "react-hot-toast";
import clsx from "clsx";

function Login() {
    const { register, handleSubmit, formState: {isSubmitting} } = useForm()
    const navigate = useNavigate()
    const onSubmit = async (data) => {
        try {
            await signInWithEmailAndPassword(auth, data.email, data.password)
            navigate('/')
        } catch (err) {
            toast.error("invalid email or password")
            console.log(err)
        }
    }

    return (<>
        <div className="flex justify-center flex-col gap-y-4 h-screen items-center">
            <div>
                <h2 className="text-2xl font-bold">Login</h2>
                <h2 className="text-sm text-green-800 font-bold">AnugrahDecal</h2>
            </div>
            <form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
                <input {...register('email')} autoComplete="username" className="border p-2 min-w-xs rounded-2xl my-2" type="email" placeholder="email" />
                <input {...register('password')} autoComplete="current-password" className="border p-2 min-w-xs rounded-2xl my-2" type="password" placeholder="password" />
                
                <button  className={clsx("hover:opacity-60 text-white rounded-2xl p-2 bg-green-600")} disabled={isSubmitting} type="submit">Submit</button>
            </form>
        </div>
    </>);
}

export default Login;